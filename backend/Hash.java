import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class Hash {
    public static void main(String[] args) {
        String raw = args.length > 0 ? args[0] : "Portfolio#123";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode(raw));
    }
}
